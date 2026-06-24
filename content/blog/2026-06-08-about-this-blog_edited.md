---
title: Warmup-01
date: 2026-06-11
tags: GPCR, SBDD, 论文阅读，Diary Style
summary: Dynamic-GLEP：一种基于动力学信息的深度学习框架，用于代表性 A 类 GPCR 的配体效能预测。
---

# Dynamic-GLEP

## 0. 生物背景学习：GPCR、ligand、receptor

GPCR 是一大类药物靶点。更准确地说，它是一类位于细胞膜上的受体蛋白。GPCR 药物设计，就是寻找或设计能够与细胞膜上某个 GPCR 结合，并且产生预期药理作用的配体。

对于不熟悉背景的人来说，第一个要弄清楚的事情就是配体（ligand）和受体（receptor）。有时候也可以粗略把受体和靶点等价。配体就是我们要设计或筛选的药物分子，在药物设计里更像未知量；受体是已知量，属于甲方。我们要根据甲方受体的结构、口袋和功能需求，去设计配体。

摘要里面说了一个很关键的区别：**binding affinity** 和 **ligand efficacy**。Binding affinity 即结合亲和力，说明配体和受体结合得紧不紧；ligand efficacy 则说明配体结合受体之后，能不能引发某种功能反应，以及能引发多强的功能反应。换句话说，结合上了不等于有效果。可以类比老式门锁，实际上尺寸差不多的钥匙都能插进去，甚至还能微微拧动，这意味着 binding affinity 可能还不错；但 ligand efficacy 只有在真正能把门打开的时候才算好。[^gpt-corr-1]

生物背景强一点的例子如下，下面表由 ChatGPT 提供：

| 配体类型 | 能不能结合 | 结合后做什么 |
| --- | ---: | --- |
| 激动剂 agonist | 能 | 激活受体，产生信号 |
| 拮抗剂 antagonist | 能 | 占住受体，但不激活 |
| 反向激动剂 inverse agonist | 能 | 把受体基础活性压低 |
| 部分激动剂 partial agonist | 能 | 激活一点，但不到最大程度 |

Q1：也就是 efficacy 是 dummy variable 吗？

配体结合之后，通常会改变受体原本在多种构象状态之间动态切换的平衡，使某些构象状态被稳定，或者让某些构象状态的占比升高。注意，受体不是被冻住了。它依旧会动。可以类比受体是一个站不太稳的人，配体来了之后，不是把这个人冻成雕塑，而是扶了他一下，让他更容易保持某一种姿势。不同配体稳定的构象状态不同，因此会导致不同的下游信号和药理作用。

Binding affinity 是成为候选配体的基础条件，但如果要成为真正有药理作用的药物，仅仅能结合还不够，还必须考虑 ligand efficacy。Efficacy 决定它结合之后能不能调控受体功能，以及怎样调控下游信号通路。以前读一些 SBDD 文章的时候，我确实经常见到 affinity。我也思考过，affinity 难道不是一种基础吗？作为一个没有药学背景的人，当时我想到的是作用时间，后续也没有下文了。

## 1. 我对“静态切片”的直觉

摘要里说的这个事儿，是我一直想说的。我一直以来都认为现在过度强调静态切片，这个词是我自己起的。无论是小模型还是大模型，我都认为有必要经历一场从静态到动态的变化。

比如对于 SBDD，站在 2026 年 6 月一名 0 年级直博生的短见上，我认为只有让尽可能多的过程变得动态，至少是可获取的，才有机会打破 AIDD 与传统 drug design 之间的高墙。当然，这背后有特别多特别多工作，我本人博士期间肯定做不完。

更难的是，可获取不一定可信。甚至我深深恐惧的一点是：可解释都不一定可信。因此我很好奇，分子动力学 MD 为什么能获得相对更高的信任？AI 或者大模型的可信问题为什么就那么严重？难道只是因为一个是规则驱动，一个是数据驱动吗？但规则本身也可能有很多没有被探视到的部分。尤其到了后来，还有 QD 的事儿，微观领域还有量子效应。分子动力学是怎么变得“相对可信”的？我们距离 AIDD 或 AI4S 的可信还有多大的 gap？

当时和北生所的邵峰院士聊完之后，能深深感受到这个问题。当然，不同的大牛之间可能有不同看法。我支持 LeCun 对世界模型的热衷。我认为在具身智能领域里，物理交互可以很好地让过程动态化。我也真的认为，很多小型工作一直过于离散化了，从 methodology 到 evaluation 都是离散化的。比如方法部分，我们考察静态切片去做很多工作；评价部分，我们又在很死板的数据集上 eval。于是泛化性能在大部分小模型上就变成白扯。

当然，我从不会否认静态切片的贡献，也不会把它一棒子打死。我只是觉得 AIDD 乃至 AI4S 领域需要某种新的 revolution。只是我道行太浅，到现在都不知道该怎么解决这个问题。是构建大模型，是世界模型，还是其他东西，现在我都没想清楚。

## 2. 本文任务：GPCR ligand efficacy prediction

回到本文。从图形摘要中可以 get 到，文章构建了受体-配体复合物，也就是构造了一套 receptor-ligand complex 数据。然后作者基于这些构象去微调一个叫 EquiScore 的模型。

在这个条件下，本文做的事情实际上是一个二分类：区分某个配体对于某个受体是 agonist 还是 nonagonist。更准确地说，标签形式是 agonist / nonagonist 二分类；但如果按靶点任务来数，5-HT1A 和 A2A 是两个 receptor-specific 的二分类任务。

一开始我眼里这可能是一个跨域二分类。因为我的本科毕业设计是《基于多数据源的多任务学习的性能分析》（PS：获评中国海洋大学本科生优秀毕业论文），在这个后遗症的影响下，我的第一反应就是：不同受体可能是不同的“域”。如果能够在不同域上实现二分类，说明泛化能力是具备的。BTW，不同受体不一定能简单等价于不同 domain，这一点我也不敢说死。当然，我本科毕业设计的指导老师 totally 是 ChatGPT & Gemini，所以我说的不一定对。

Q1（未解决）：那我现在的问题就在于这个任务是否有点奇怪。外行地理解，ligand 到底是否是该 GPCR 的 agonist，难道不是一开始就决定的吗？和不同构象有什么关系？可能内行看我的问题也很愚蠢。在我眼里，ligand 是否能够成为 GPCR 的 agonist，是通过让它俩结合一下，然后看下游反应，很直观就可以体现出来。除非这个过程本身非常难以获取。

下面内容由 ChatGPT 生成，如果准确的话，它很好地让我理解了 ligand 的作用以及不同效能带来的变化：

```text
GPCR 原本在很多构象之间波动：
inactive-like
intermediate-like
active-like
G protein-favored state
β-arrestin-favored state
其他局部状态

配体结合后，会改变这些状态的概率分布。

比如：
没有 ligand 时：
inactive 80%，intermediate 15%，active 5%

某个 agonist 结合后：
inactive 30%，intermediate 30%，active 40%

某个 antagonist 结合后：
inactive 85%，intermediate 10%，active 5%。
```

这让我想到条件分布。当然，条件分布里不讲究那么多序关系，而生物分子的建模过程肯定是一个随机过程序列，构象的连续性是很重要的。

## 3. Holo 与 Apo：两个概念维度，不是 active / inactive

然后出现两个新词：holo 和 apo。经过与 ChatGPT 的促膝长谈，我大致明白了：Holo 是已经结合了配体或复合物的受体结构；Apo 是 ligand-free 的、没有结合配体的蛋白结构。Holo 结构常常有一个被配体预先稳定的 binding pocket，但不能简单理解成“被撑大”的状态，因为不同 ligand 也可能稳定不同口袋形态。[^gpt-corr-2]

| 维度 | 问的问题 | 例子 |
| --- | --- | --- |
| Apo / Holo | 有没有结合配体或复合物？ | Apo = 无配体；Holo = 有配体/复合物 |
| Active / Inactive | 受体处于激活态还是非激活态？ | active-like / inactive-like |

Apo / Holo 和 active / inactive 是两组不同维度。

- Apo inactive：无配体，非激活态；
- Apo active-like：无配体，但被建模或短暂采样到 active-like 状态；
- Holo inactive：结合 antagonist / inverse agonist 的非激活态；
- Holo active：结合 agonist / G protein 的激活态。

现实里，GPCR 的 active 结构往往需要 agonist、G protein 或稳定抗体帮助稳定，所以常见 active structure 很多是 Holo。但概念上，Apo 不等于 inactive，Holo 也不等于 active。

## 4. 数据集：C-5HT1A 与 I-5HT1A

然后是数据集选取与构造。C-5HT1A 是对于固定受体 5-HT1A 的一系列生物学上已知 Emax 的化合物们，也就是 ligands。作者根据 Emax 数值区分是否为 agonist。值得注意的是，Emax 并非必须落在 0 到 100 之间。对于某个固定受体，Emax 往往是相对于某个 reference agonist 的最大反应来归一化的百分比，所以 Emax 可以大于 100。本文使用 50% 作为 agonist / nonagonist 的阈值。

这也解释了 Fig. 1 的小提琴图为什么我一开始看不太懂。至于为什么我感觉 50 以下也有 agonist 的成分，ChatGPT 给到的解释是：小提琴图使用 KDE，也就是核密度估计，会把离散数据平滑成连续曲线，因此图形边界可能产生轻微外溢。[^gpt-corr-3]

这部分是 internal dataset。

外部测试集是 I-5HT1A。它和 C-5HT1A 的 training set、testing set 一起做了 t-SNE 低维映射。图示的内部测试集看起来更像 structural similarity split / Tanimoto split，而不是完全 random split，但图本身没有把 split 细节完整说透。这个图展示出内部训练集、内部测试集、外部测试集不是完全同一个分布；尤其外部测试集覆盖了一些不同的化学空间，因此可以用来考察泛化能力。

## 5. Receptor 构象构建：MD、PCA 与 RRCS

随后是 receptor 构象的构建。我用自己的语言重述一下这个过程。

在摘要里已经能明白，针对一个受体，本文的方法是使用 MD 提取该受体的代表性构象。本文主要围绕 active 和 inactive 初始状态展开 MD 采样，再从这些轨迹里筛选代表性 snapshots。这里的中间态不是不能 docking，而是作者的初始建模和标签解释主要围绕 active / inactive 这条结构状态轴展开；后续 RRCS 筛选理论上也希望覆盖 active、inactive 和 intermediate-like snapshots。[^gpt-corr-4]

本文对 5-HT1A 做了两种工作流：Holo workflow 和 Apo workflow。也就是说，对于同一个受体，作者会比较有配体结合背景的初始结构和无配体背景的初始结构。这里又回到了我非常关心的问题：Holo active 来自 5-HT1A–Gi protein complex，但原文目前没有明说 Gi 蛋白是否在 MD 中保留，是带着一起做 MD，还是只把 receptor conformation 拿出来作为起点。

我觉得很诡异的一点是：Holo / Apo 和 active / inactive 并不是同一个维度。无论是否是激动剂，holo 了就势必会改变其 inactive 或 active 的信息密度与数据来源。除非说 5-HT1A–Gi 是一种无比公平的 holo，但这显然需要更多方法细节来支撑。其他包括 MD 的环境和设置，我目前默认是一种背景，不做细细研究。

PCA 的小红三角分布比较散，所以后续 docking 用这些构象是有意义的，至少不算是明显重复性的。

关于 RRCS 的 Fig. 2b，逻辑是：先去看一个 GPCR 构象内部残基-残基之间的接触关系，用这种指标描述构象状态。于是可以看出来 active-like 和 inactive-like 的 density function 有很显著的差别。也就是说，RRCS 这个指标能区分 active-like 和 inactive-like 受体构象。

RRCS 不仅担任区分构象状态的作用，还担任筛选代表性 snapshot 的作用。注意，这里的代表性指代表某一个 receptor system / workflow 的构象集合。原本 5-HT1A Holo 和 Apo 加起来会有大量 snapshots，作者不可能把所有 snapshots 全部拿去做 ensemble docking，否则计算量会很大。[^gpt-corr-5]

所以作者引入 RRCS 筛选。RRCS 的计算方式大体上是围绕 Class A GPCR 激活相关的关键残基位置或残基对，计算残基接触变化。文章里写的是 four residue pairs，但括号里的写法并不干净：`3×43` 和 `7×49` 单独看更像残基位置，不是 residue pair；真正像残基对的是 `3×43:7×53`、`3×46:7×53`、`3×50:7×53`。[^gpt-corr-6]

RRCS selection 是一个基于人工指定结构指标的启发式构象筛选流程。作者说明了 RRCS 的生物物理动机，也展示了 active / inactive 在 RRCS 分布上的分离，但没有充分交代从 snapshots 到 48 / 60 / 47 个 selected conformations 的具体算法细节。例如：采样点如何确定、active / inactive 比例是否平衡、冗余阈值如何设置。因此这一步更像结构先验驱动的 ensemble pruning，而不是完全透明、端到端学习得到的选择策略。

最后选出来的 selected conformations 是去做 ensemble docking 和后续分析，而不是再去做 MD。[^gpt-corr-7]

## 6. Ensemble docking：我仍然觉得 Apo 细节没讲清

现在已经筛选完 snapshots 了。由于 PDB 或 MD 得到的蛋白质结构里面可能有氢原子缺失、侧链缺失、loop 缺失等一系列问题，所以作者先用了 Schrödinger Maestro 2022-4 进行预处理。

我的问题是，原文说：

> Missing side chains and loops were reconstructed, and water molecules beyond 5 Å of any ligand were excluded.

对于 Holo，我可以理解为那个本身用来稳定口袋的 ligand；但 Apo 按道理说没有 ligand，这句话就不那么好理解。

然后对于配体，作者结合 Epik 模块用 LigPrep 进行处理。接下来要找到 receptor grid，也就是可以 docking 的网格。文章说网格会根据 cocrystallized ligand 进行调整，那依旧是这个问题：Holo 这里很自然，但是 Apo 的细节完全没描述。Apo 的 inactive 来自过去实验解析得到的晶体结构，active 是同源建模，所以我无法理解 Apo workflow 是何来的 cocrystallized ligand。

对于 Holo，大概率是从 5-HT1A–Gi complex 里拿 receptor active 构象，然后构建 receptor conformational ensemble。Gi 只是 active-state receptor structure 的来源，不一定在 MD 里保留。但如果 MD 不保留原来的小 ligand 或复合物成分，却仍然用原 ligand 定 grid，就会有强行套模板的风险。很可能 MD 生成的某些 snapshots 里面，口袋已经变形或者塌陷，这样对于特定 snapshot 来说，receptor grid 可能就不再合理。

## 7. 迁移学习：EquiScore TL

接下来到了喜闻乐见的“迁移学习”环节。按 transfer learning 的正常语义，作者是挪用了 EquiScore 的预训练权重或表征能力作为初始化基础，然后在 ligand efficacy 任务上训练，于是 train 就变成了 fine-tune。但严格来说，原文对具体权重加载、冻结策略和哪些层参与训练没有讲得非常透明，所以这里不能把所有细节说死。[^gpt-corr-8]

模型先把每个 docked protein–ligand complex 构造成一个异质图。图里有蛋白节点、配体原子节点、芳香环虚拟节点；边包括空间距离边、共价键边、蛋白内部邻接边和相互作用指纹边。然后用 EquiScore 这个等变图神经网络对每个复合物做几何 message passing，提取倒数第二层的高维 complex embedding。

由于每个 ligand 会被 dock 到多个 receptor conformations 上，所以一个 ligand 会得到多个 complex embeddings。作者把这些多构象 embedding 拼接起来，送入三层全连接网络，最后用 sigmoid 输出这个 ligand 是 agonist 的概率。训练用二分类交叉熵和 Adam。

值得注意的是，比如对于一个 ligand，在某一个 system / workflow 中，如果它 dock 到 48 个代表性 receptor conformations 上，就会生成 48 个 heterogeneous graphs。但合理流程应当是以 ligand 为单位，而不是以 heterogeneous graph 为单位。也就是说：异质图分别经过 EquiScore，得到 48 个 complex embeddings；这些 embeddings 再拼接或聚合成一个 multi-conformation representation；这个 representation 才会作为该 ligand 的最终输入；最后输出一个 y_pred，判断这个 ligand 是 agonist 还是 nonagonist，再计算 loss。

## 8. 第一个验证：active / inactive 偏好与 Glide score

第一个实验主要是验证：nonagonist 是否更偏好 inactive receptor 构象，full agonist 是否更偏好 active receptor 构象。

Fig. 4a 展示了 Class A GPCR 激活时 TM6 的胞内端向外摆动。意义是告诉读者：active 的时候 TM6 更外摆，inactive 的时候 TM6 更收着。

Fig. 4b 的热图展示的是 active 与 inactive 状态下不同残基之间的接触强度或距离关系。它说明受体状态本身确实有构象差异，这些差异和 GPCR 的 active / inactive 状态有关。

Fig. 4c 不是热图，而是箱线图 / 分布图。它比较两个 ligands 在 active / inactive receptor snapshots 上的 Glide docking scores。Glide score 越低、越负，通常代表 docking 软件认为结合越好。[^gpt-corr-9]

这个实验作为机制示例是有意义的，但只分析两个 ligand，所以证明力度有限。它更像是告诉读者：多构象 docking score 的分布可能和 efficacy 有关系，而不是严格证明所有 agonist / nonagonist 都遵循这个规律。

## 9. Fig. 2 的结果解释：PCA 和 RRCS 的合理性背书

然后下一段实际上是对 Fig. 2 进行解释。我刚刚就说 Fig. 2 画出来之后一声不吭，原来在这里。

这部分和我们前面自行分析的结论基本一致：作者用 PCA 检查 5-HT1A 的 active 和 inactive MD 构象是否有足够结构多样性。Inactive 的前两个主成分解释率更高，本文认为 inactive 构象空间更受限，active 更灵活。

有一说一，这个解释讲故事的成分还是有点大。PCA 能说明方差分布，但“inactive 更稳定”“active 更灵活”这种解释，需要更多结构统计或能量分析来支撑。

## 10. 对比实验：static baseline、dynamic ensemble 和 EquiScore TL

再往后是对比实验。对于一些静态模型，AUC 在 0.5 左右，意味着基本接近瞎猜。因此作者引出了动态构象的重要性。

EquiScore TL 是 Dynamic-GLEP 里的核心模型版本。EquiScore Base 大概是没有迁移学习或没有有效 fine-tuning 的基础 EquiScore 版本；EquiScore RF 是把多构象下的 EquiScore score 或特征给 Random Forest 做分类。于是作者得出所谓“用迁移学习后的 EquiScore 表示更好”的结论。

这个事情在我看来有点诡异。都 fine-tune 过了，怎么可能低于微调之前的？当然，更严格地说，fine-tune 后仍然可能因为过拟合、数据小、优化不稳定、特征接口不同而表现不如某些 baseline，但在作者的叙事里，EquiScore TL 更好是符合预期的。

以及 MCC 在 0.5 左右，尤其在 Tanimoto / fingerprint-based split 下，说明模型性能并没有到特别强的程度。但 MCC 主要是分类性能指标，不直接说明“解释性”强不强。[^gpt-corr-10]

## 11. Interpretability analysis：我觉得它更像结构合理性展示

本文选了 4 个结构差异较大的 5-HT1A ligands，逐个看它们在 active / inactive receptor conformations 里的结合姿势和关键相互作用。

这一系列内容我都能看明白，但我对逻辑链是深深怀疑的。它没有真正证明模型的预测是由这些关键相互作用驱动的。它说明了：首先现实背景十分复杂；其次多构象 docking 的输入有意义，比如同一个 ligand 在 active / inactive 中的结合模式会改变；再次，Dynamic-GLEP 的输入设计是有意义的。但这些都不能说明整个模型的决策有解释性。

换句话说，这部分更像 structure-based case study，或者模型输入合理性说明。它可以说明 Dynamic-GLEP 考虑了哪些东西，也可以说明这些东西确实与 GPCR ligand efficacy 的现实背景有关。但它不是严格的 attribution，不是消融，也不是 counterfactual explanation。

以及全文都有 cherry-picking 风险。真的，本文在 cherry-picking 方面仿佛完全无视一样，非常大胆。

## 12. Holo versus Apo：解决了一些问题，但没完全解决

后面实验的意思是：Holo 更适合 random split 的训练集和测试集，所以看起来更像是在已知化学空间附近做插值预测。作者在讲故事层面把它解释为适合先导化合物优化和 SAR refinement。

Apo 更适合 Tanimoto / fingerprint-based split 和外部验证集。作者认为 Apo 模拟能探索更宽的构象空间，所以对 novel scaffold generalization 更有利。但作者本人也承认：Apo 因为没有 ligand 支撑 binding pocket，MD 过程中局部口袋可能收缩、变形甚至塌陷。这和我前面说的是类似的。感觉怪怪的。

这一段确实解决了部分问题：它明确说 5-HT1A 有 Holo-based workflow 和 Apo-based workflow，而且二者在 MD 参数、ligand 数据、构象筛选和网络结构上保持一致。它也明确说 Holo 和 Apo 的优势互补。

但它没完全解决我之前最关心的问题。比如：Holo MD 里原 ligand / Gi 是否保留？Apo workflow 里的 cocrystallized ligand grid 怎么定义？口袋 collapse 怎么判断和过滤？同源建模质量如何评估？这些仍然没有讲透。

## 13. A2A：跨靶点泛化，可能是补强实验

A2A 是最后一个实验。我的直觉是，它像是审稿人说泛化性不够之后补的一个实验，hhh。当然这只是我的猜测。

A2A 不是 5-HT1A 的外部验证集，而是另一个 receptor-specific task。作者用 A2A 来证明 Dynamic-GLEP 不是只在 5-HT1A 上能跑。A2A 的数据集更小，只有 75 个 ligands，其中 22 个 agonists，53 个 nonagonists。作者使用 A2A active structure PDB 4UHR 和 inactive structure PDB 3UZA 建立 conformational ensemble，并训练 A2A-specific EquiScore TL 模型。

值得注意的是，A2A 图里出现了 `EquiScore_TL(Holo)`，说明 A2A 这个 workflow 是基于 A2A holo structures 的。但它没有像 5-HT1A 那样系统比较 A2A Holo versus A2A Apo。更准确地说：5-HT1A 做了 Holo / Apo 对照；A2A 只报告了 Holo-based 的 Dynamic-GLEP 结果。

所以 A2A 这部分的 cross-target generalizability，更准确说是同一套 pipeline 可以迁移到另一个 GPCR 靶点，而不是一个 5-HT1A 训练好的模型 zero-shot 泛化到 A2A。

## ChatGPT 修正注

[^gpt-corr-1]: ChatGPT 修正：原文多处写成 ligand efficiency / Efficiency。这里应为 **ligand efficacy**。Ligand efficiency 在药物化学中也有含义，通常指单位分子大小带来的结合效率，不等同于 efficacy。

[^gpt-corr-2]: ChatGPT 修正：Holo 不宜直接等同于“撑大的状态”。更稳妥说法是 ligand-bound / complex-bound structure，其中结合口袋可能被某个配体或复合物预先稳定。

[^gpt-corr-3]: ChatGPT 修正：原文写成 KDD，这里应为 **KDE**，即 kernel density estimation，核密度估计。

[^gpt-corr-4]: ChatGPT 修正：不能说中间态“难以 docking”。理论上任何有合理口袋的 receptor conformation 都可以 docking。本文主要是从 active / inactive 初始结构出发采样，再用 RRCS 等方法选代表构象。

[^gpt-corr-5]: ChatGPT 修正：这里不是“不能全都跑 MD”。MD 已经产生了 snapshots。真正计算量大的后续步骤是对大量 snapshots 做 ensemble docking、构图和模型特征提取。

[^gpt-corr-6]: ChatGPT 修正：文章写 “four residue pairs” 但括号里列出的 `3×43`、`7×49` 单独看是 Ballesteros-Weinstein 位置，不是残基对。这里的原文表述本身不够严谨。

[^gpt-corr-7]: ChatGPT 修正：selected conformations 后续用于 ensemble docking 和进一步分析，不是再去做 MD。

[^gpt-corr-8]: ChatGPT 修正：迁移学习一般意味着加载预训练 EquiScore 的权重或表征能力，但文章没有完全交代权重是否全部加载、哪些层冻结、哪些层微调，因此不能把实现细节说得过死。

[^gpt-corr-9]: ChatGPT 修正：Fig. 4c 是箱线图 / 分布图，不是热图。它展示的是两个 ligand 在 active / inactive snapshots 上的 Glide docking score 分布。

[^gpt-corr-10]: ChatGPT 修正：MCC 是分类性能指标，主要说明模型预测质量。它不能直接评价模型解释性。解释性需要 attribution、消融、反事实扰动或结构机制验证等额外证据。
